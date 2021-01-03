<template>
  <v-stage
    ref="stage"
    :config="stageSize"
    @mousemove="handleMouseMove"
    @mouseDown="handleMouseDown"
    @mouseUp="handleMouseUp"
  >
    <v-layer ref="layer">
      <v-text
        ref="text"
        :config="{
          x: 10,
          y: 10,
          fontSize: 20,
          text: text,
          fill: 'black',
        }"
      />
      <v-rect
        v-for="(rec, index) in recs"
        :key="index"
        :config="{
          x: Math.min(rec.startPointX, rec.startPointX + rec.width),
          y: Math.min(rec.startPointY, rec.startPointY + rec.height),
          width: Math.abs(rec.width),
          height: Math.abs(rec.height),
          fill: 'rgb(0,0,0,0)',
          stroke: 'black',
          strokeWidth: 3,
        }"
      />
    </v-layer>
  </v-stage>
</template>

<script>
const width = window.innerWidth;
const height = window.innerHeight;

export default {
  data() {
    return {
      stageSize: {
        width: width,
        height: height,
      },
      text: "Try to draw a rectangle",
      lines: [],
      isDrawing: false,
      recs: [],
    };
  },
  methods: {
    handleMouseDown(event) {
      this.isDrawing = true;
      const pos = this.$refs.stage.getNode().getPointerPosition();
      this.setRecs([
        ...this.recs,
        { startPointX: pos.x, startPointY: pos.y, width: 0, height: 0 },
      ]);
    },
    handleMouseUp() {
      this.isDrawing = false;
    },
    setRecs(element) {
      this.recs = element;
    },
    handleMouseMove(event) {
      // no drawing - skipping
      if (!this.isDrawing) {
        return;
      }
      // console.log(event);
      const point = this.$refs.stage.getNode().getPointerPosition();
      // handle  rectangle part
      let curRec = this.recs[this.recs.length - 1];
      curRec.width = point.x - curRec.startPointX;
      curRec.height = point.y - curRec.startPointY;
    },
  },
};
</script>
